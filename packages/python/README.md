# stellar-x402 (Python)

Python ASGI and FastAPI middleware for HTTP 402 payments settled on Stellar.

Documentation: [https://x402-stellar.mintlify.app](https://x402-stellar.mintlify.app)

---

## Installation

```bash
pip install stellar-x402
```

---

## FastAPI Quickstart

```python
from fastapi import FastAPI, Request
from x402 import X402Middleware, RoutePricingPolicy

app = FastAPI()

# Apply x402 paywall to /api/v1 endpoints
app.add_middleware(
    X402Middleware,
    policy=RoutePricingPolicy(
        path="/api/v1",
        price="0.01", # 0.01 USDC
        asset="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        recipient="GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6",
        network="stellar:testnet",
    )
)

@app.get("/api/v1/forecast")
async def get_forecast(request: Request):
    # Payment is guaranteed verified here
    payment = request.scope.get("x402_payment")
    return {"city": "New York", "temperature": 68, "payer": payment.payer}
```

---

## License
Apache-2.0
