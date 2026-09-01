package main

import (
	"flag"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/x402-stellar/gateway-app/proxy/internal/config"
	"github.com/x402-stellar/gateway-app/proxy/internal/proxy"
	"github.com/x402-stellar/gateway-app/proxy/internal/x402"
)

func main() {
	configPath := flag.String("config", "config.yaml", "Path to YAML configuration file")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		slog.Error("failed_to_load_config", "error", err)
		os.Exit(1)
	}

	upstreamProxy, err := proxy.NewGatewayProxy(cfg.UpstreamURL)
	if err != nil {
		slog.Error("failed_to_init_upstream_proxy", "error", err)
		os.Exit(1)
	}

	interceptor := x402.NewInterceptor(cfg.Routes, cfg.DefaultNet)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"stellar-x402-gateway"}`))
	})

	// Mount x402 interceptor and upstream forwarder
	r.Mount("/", interceptor.Middleware(upstreamProxy))

	slog.Info("starting_gateway_proxy", "addr", cfg.ListenAddr, "upstream", cfg.UpstreamURL)
	if err := http.ListenAndServe(cfg.ListenAddr, r); err != nil {
		slog.Error("server_crashed", "error", err)
	}
}
