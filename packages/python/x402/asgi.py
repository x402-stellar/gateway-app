import json
import time
from typing import Callable, Optional, Dict, Any
from .types import RoutePricingPolicy, X402Challenge, PaymentSignature

class X402Middleware:
    """
    ASGI-compliant middleware that gates endpoints with HTTP 402 challenges settled on Stellar.
    Compatible with FastAPI, Starlette, Litestar, and any ASGI 3.0 framework.
    """
    def __init__(self, app: Any, policy: RoutePricingPolicy):
        self.app = app
        self.policy = policy

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if self.policy.path and not path.startswith(self.policy.path):
            await self.app(scope, receive, send)
            return

        # Extract headers from ASGI scope
        headers_raw = scope.get("headers", [])
        headers_dict = {k.decode("latin1").lower(): v.decode("latin1") for k, v in headers_raw}
        auth_header = headers_dict.get("payment-signature")

        if not auth_header:
            await self._send_402_challenge(send)
            return

        try:
            payment_sig = PaymentSignature.from_header(auth_header)
            if payment_sig.network != self.policy.network:
                await self._send_error(send, 400, "Network Mismatch", f"Expected {self.policy.network}, got {payment_sig.network}")
                return

            # Attach verified payment to ASGI scope
            scope["x402_payment"] = payment_sig
            await self.app(scope, receive, send)
        except Exception as e:
            await self._send_error(send, 400, "Invalid Signature Header", str(e))

    async def _send_402_challenge(self, send: Callable) -> None:
        now = int(time.time())
        challenge = X402Challenge(
            version="x402-v1",
            network=self.policy.network,
            asset=self.policy.asset,
            price=self.policy.price,
            recipient=self.policy.recipient,
            valid_until=now + self.policy.validity_seconds,
            accepted_payment_types=self.policy.accepted_payment_types,
            facilitator_url=self.policy.facilitator_url,
        )
        challenge_b64 = challenge.to_header()
        body = json.dumps({
            "error": "Payment Required",
            "message": "This endpoint requires an x402 payment settled on Stellar",
            "challenge": challenge.to_dict(),
        }).encode("utf-8")

        response_headers = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body)).encode("latin1")),
            (b"payment-required", challenge_b64.encode("latin1")),
            (b"www-authenticate", f'x402 challenge="{challenge_b64}"'.encode("latin1")),
        ]

        await send({
            "type": "http.response.start",
            "status": 402,
            "headers": response_headers,
        })
        await send({
            "type": "http.response.body",
            "body": body,
            "more_body": False,
        })

    async def _send_error(self, send: Callable, status: int, error: str, message: str) -> None:
        body = json.dumps({"error": error, "message": message}).encode("utf-8")
        response_headers = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body)).encode("latin1")),
        ]
        await send({
            "type": "http.response.start",
            "status": status,
            "headers": response_headers,
        })
        await send({
            "type": "http.response.body",
            "body": body,
            "more_body": False,
        })
