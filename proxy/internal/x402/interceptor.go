package x402

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/x402-stellar/gateway-app/proxy/internal/config"
)

type Challenge struct {
	Version    string `json:"version"`
	Network    string `json:"network"`
	Asset      string `json:"asset"`
	Price      string `json:"price"`
	Recipient  string `json:"recipient"`
	ValidUntil int64  `json:"validUntil"`
}

type Interceptor struct {
	routes map[string]config.RoutePolicy
}

func NewInterceptor(routes []config.RoutePolicy, defaultNet string) *Interceptor {
	routeMap := make(map[string]config.RoutePolicy)
	for _, r := range routes {
		if r.Network == "" {
			r.Network = defaultNet
		}
		routeMap[r.Path] = r
	}
	return &Interceptor{routes: routeMap}
}

func (i *Interceptor) MatchPolicy(path string) *config.RoutePolicy {
	for prefix, policy := range i.routes {
		if strings.HasPrefix(path, prefix) {
			return &policy
		}
	}
	return nil
}

func (i *Interceptor) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		policy := i.MatchPolicy(r.URL.Path)
		if policy == nil {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("payment-signature")
		if authHeader == "" {
			challenge := Challenge{
				Version:    "x402-v1",
				Network:    policy.Network,
				Asset:      policy.Asset,
				Price:      policy.Price,
				Recipient:  policy.Recipient,
				ValidUntil: time.Now().Add(5 * time.Minute).Unix(),
			}

			payload, _ := json.Marshal(challenge)
			encoded := base64.StdEncoding.EncodeToString(payload)

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("PAYMENT-REQUIRED", encoded)
			w.Header().Set("WWW-Authenticate", `x402 challenge="`+encoded+`"`)
			w.WriteHeader(http.StatusPaymentRequired)

			_ = json.NewEncoder(w).Encode(map[string]any{
				"error":     "Payment Required",
				"message":   "This endpoint requires x402 payment settled on Stellar",
				"challenge": challenge,
			})
			return
		}

		// Signature present: allow forward
		next.ServeHTTP(w, r)
	})
}
