package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
)

type GatewayProxy struct {
	reverseProxy *httputil.ReverseProxy
}

func NewGatewayProxy(upstreamURL string) (*GatewayProxy, error) {
	target, err := url.Parse(upstreamURL)
	if err != nil {
		return nil, fmt.Errorf("invalid upstream URL: %w", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	return &GatewayProxy{reverseProxy: proxy}, nil
}

func (p *GatewayProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	p.reverseProxy.ServeHTTP(w, r)
}
