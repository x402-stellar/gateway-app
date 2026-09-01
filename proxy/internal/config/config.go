package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type RoutePolicy struct {
	Path      string `yaml:"path"`
	Price     string `yaml:"price"`
	Asset     string `yaml:"asset"`
	Recipient string `yaml:"recipient"`
	Network   string `yaml:"network"`
}

type Config struct {
	ListenAddr   string        `yaml:"listen_addr"`
	UpstreamURL  string        `yaml:"upstream_url"`
	DefaultNet   string        `yaml:"default_network"`
	Routes       []RoutePolicy `yaml:"routes"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse yaml config: %w", err)
	}

	if cfg.ListenAddr == "" {
		cfg.ListenAddr = ":8080"
	}
	if cfg.DefaultNet == "" {
		cfg.DefaultNet = "stellar:testnet"
	}

	return &cfg, nil
}
