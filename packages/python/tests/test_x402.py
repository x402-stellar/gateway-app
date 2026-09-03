import unittest
import asyncio
import json
import base64
from x402.types import RoutePricingPolicy, X402Challenge, PaymentSignature
from x402.asgi import X402Middleware

class TestX402Python(unittest.TestCase):
    def test_challenge_roundtrip(self):
        challenge = X402Challenge(
            version="x402-v1",
            network="stellar:testnet",
            asset="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
            price="0.05",
            recipient="GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6",
            valid_until=1772635200,
            accepted_payment_types=["soroban_sac", "stellar_classic"],
        )
        header = challenge.to_header()
        self.assertIsInstance(header, str)

        parsed = X402Challenge.from_header(header)
        self.assertEqual(parsed.version, "x402-v1")
        self.assertEqual(parsed.network, "stellar:testnet")
        self.assertEqual(parsed.price, "0.05")
        self.assertEqual(parsed.accepted_payment_types, ["soroban_sac", "stellar_classic"])

    def test_payment_signature_parsing(self):
        payload = {
            "network": "stellar:testnet",
            "payer": "GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M",
            "paymentType": "soroban_sac",
            "authEntryXdr": "AAAAAgAAAAE...",
            "nonce": 42,
        }
        b64 = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
        sig = PaymentSignature.from_header(b64)
        self.assertEqual(sig.payer, payload["payer"])
        self.assertEqual(sig.nonce, 42)
        self.assertEqual(sig.payment_type, "soroban_sac")

    def test_asgi_middleware_unpaid_challenge(self):
        policy = RoutePricingPolicy(
            path="/api",
            price="0.01",
            asset="CDLZFC3...",
            recipient="GCAL...",
            network="stellar:testnet",
        )

        async def downstream_app(scope, receive, send):
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b"OK", "more_body": False})

        middleware = X402Middleware(downstream_app, policy)

        scope = {
            "type": "http",
            "path": "/api/v1/data",
            "headers": [],
        }

        messages = []

        async def send(msg):
            messages.append(msg)

        async def receive():
            return {"type": "http.request"}

        asyncio.run(middleware(scope, receive, send))

        self.assertEqual(messages[0]["status"], 402)
        headers_dict = dict(messages[0]["headers"])
        self.assertIn(b"payment-required", headers_dict)
        self.assertIn(b"www-authenticate", headers_dict)

    def test_asgi_middleware_paid_passthrough(self):
        policy = RoutePricingPolicy(
            path="/api",
            price="0.01",
            asset="CDLZFC3...",
            recipient="GCAL...",
            network="stellar:testnet",
        )

        async def downstream_app(scope, receive, send):
            payment = scope.get("x402_payment")
            body = json.dumps({"status": "delivered", "payer": payment.payer}).encode("utf-8")
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": body, "more_body": False})

        middleware = X402Middleware(downstream_app, policy)

        payload = {
            "network": "stellar:testnet",
            "payer": "GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M",
            "paymentType": "soroban_sac",
            "authEntryXdr": "AAAA...",
            "nonce": 1,
        }
        b64 = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

        scope = {
            "type": "http",
            "path": "/api/v1/data",
            "headers": [(b"payment-signature", b64.encode("latin1"))],
        }

        messages = []

        async def send(msg):
            messages.append(msg)

        async def receive():
            return {"type": "http.request"}

        asyncio.run(middleware(scope, receive, send))

        self.assertEqual(messages[0]["status"], 200)
        res_body = json.loads(messages[1]["body"].decode("utf-8"))
        self.assertEqual(res_body["status"], "delivered")
        self.assertEqual(res_body["payer"], payload["payer"])

if __name__ == "__main__":
    unittest.main()
