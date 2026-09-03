from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
import base64
import json
import time

@dataclass
class RoutePricingPolicy:
    price: str
    asset: str
    recipient: str
    network: str = "stellar:testnet"
    path: Optional[str] = None
    validity_seconds: int = 300
    accepted_payment_types: List[str] = field(default_factory=lambda: ["soroban_sac", "stellar_classic"])
    facilitator_url: Optional[str] = None

@dataclass
class X402Challenge:
    version: str
    network: str
    asset: str
    price: str
    recipient: str
    valid_until: int
    accepted_payment_types: Optional[List[str]] = None
    facilitator_url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "version": self.version,
            "network": self.network,
            "asset": self.asset,
            "price": self.price,
            "recipient": self.recipient,
            "validUntil": self.valid_until,
        }
        if self.accepted_payment_types:
            d["acceptedPaymentTypes"] = self.accepted_payment_types
        if self.facilitator_url:
            d["facilitatorUrl"] = self.facilitator_url
        return d

    def to_header(self) -> str:
        payload = json.dumps(self.to_dict()).encode("utf-8")
        return base64.b64encode(payload).decode("utf-8")

    @classmethod
    def from_header(cls, header_val: str) -> "X402Challenge":
        raw = base64.b64decode(header_val.encode("utf-8")).decode("utf-8")
        data = json.loads(raw)
        return cls(
            version=data.get("version", "x402-v1"),
            network=data["network"],
            asset=data["asset"],
            price=data["price"],
            recipient=data["recipient"],
            valid_until=data["validUntil"],
            accepted_payment_types=data.get("acceptedPaymentTypes"),
            facilitator_url=data.get("facilitatorUrl"),
        )

@dataclass
class PaymentSignature:
    network: str
    payer: str
    payment_type: str = "soroban_sac"
    auth_entry_xdr: Optional[str] = None
    nonce: Optional[int] = None
    transaction_envelope_xdr: Optional[str] = None
    memo: Optional[str] = None
    amount: Optional[str] = None
    channel_id: Optional[str] = None
    voucher_index: Optional[int] = None
    voucher_signature: Optional[str] = None

    @classmethod
    def from_header(cls, header_val: str) -> "PaymentSignature":
        raw = base64.b64decode(header_val.encode("utf-8")).decode("utf-8")
        data = json.loads(raw)
        return cls(
            network=data["network"],
            payer=data["payer"],
            payment_type=data.get("paymentType", "soroban_sac"),
            auth_entry_xdr=data.get("authEntryXdr"),
            nonce=data.get("nonce"),
            transaction_envelope_xdr=data.get("transactionEnvelopeXdr"),
            memo=data.get("memo"),
            amount=data.get("amount"),
            channel_id=data.get("channelId"),
            voucher_index=data.get("voucherIndex"),
            voucher_signature=data.get("voucherSignature"),
        )
