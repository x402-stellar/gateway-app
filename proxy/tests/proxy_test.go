package tests

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/x402-stellar/gateway-app/proxy/internal/config"
	"github.com/x402-stellar/gateway-app/proxy/internal/proxy"
	"github.com/x402-stellar/gateway-app/proxy/internal/x402"
)

func TestGatewayProxyInterception(t *testing.T) {
	// Mock upstream server
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"data":"secret_model_response"}`))
	}))
	defer upstream.Close()

	routes := []config.RoutePolicy{
		{
			Path:      "/inference",
			Price:     "0.005",
			Asset:     "USDC_TEST",
			Recipient: "MERCHANT_ADDR",
			Network:   "stellar:testnet",
		},
	}

	upstreamProxy, err := proxy.NewGatewayProxy(upstream.URL)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}

	interceptor := x402.NewInterceptor(routes, "stellar:testnet")
	gatewayServer := httptest.NewServer(interceptor.Middleware(upstreamProxy))
	defer gatewayServer.Close()

	// 1. Request without signature should return 402
	resp, err := http.Get(gatewayServer.URL + "/inference")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusPaymentRequired {
		t.Errorf("expected status 402, got %d", resp.StatusCode)
	}
	if resp.Header.Get("PAYMENT-REQUIRED") == "" {
		t.Errorf("expected PAYMENT-REQUIRED header in 402 response")
	}

	// 2. Request with signature should pass to upstream
	req, _ := http.NewRequest("GET", gatewayServer.URL+"/inference", nil)
	req.Header.Set("payment-signature", "MOCK_SIGNATURE_PAYLOAD")

	client := &http.Client{}
	resp2, err := client.Do(req)
	if err != nil {
		t.Fatalf("authenticated request failed: %v", err)
	}
	if resp2.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", resp2.StatusCode)
	}

	body, _ := io.ReadAll(resp2.Body)
	if string(body) != `{"data":"secret_model_response"}` {
		t.Errorf("unexpected body: %s", string(body))
	}
}
