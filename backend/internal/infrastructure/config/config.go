package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// LoadConfig 從環境變數和配置檔案載入配置
func LoadConfig(configPath string) (*Config, error) {
	config := DefaultConfig()
	
	// 設定 Viper 配置
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	if configPath != "" {
		viper.AddConfigPath(configPath)
	}
	viper.AddConfigPath("./configs")
	viper.AddConfigPath(".")
	
	// 支援環境變數
	viper.SetEnvPrefix("PINGNOM")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
	
	// 設定預設值
	setDefaults(&config)
	
	// 讀取配置檔案 (可選，不存在也不會出錯)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}
	
	// 將配置解析到結構體
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}
	
	// 驗證配置
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}
	
	return &config, nil
}

func setDefaults(config *Config) {
	viper.SetDefault("environment", config.Environment)
	viper.SetDefault("log_level", config.LogLevel)
	viper.SetDefault("server.host", config.Server.Host)
	viper.SetDefault("server.port", config.Server.Port)
	viper.SetDefault("server.read_timeout", config.Server.ReadTimeout)
	viper.SetDefault("server.write_timeout", config.Server.WriteTimeout)
	viper.SetDefault("server.idle_timeout", config.Server.IdleTimeout)
	viper.SetDefault("server.shutdown_timeout", config.Server.ShutdownTimeout)
	
	viper.SetDefault("database.host", config.Database.Host)
	viper.SetDefault("database.port", config.Database.Port)
	viper.SetDefault("database.user", config.Database.User)
	viper.SetDefault("database.password", config.Database.Password)
	viper.SetDefault("database.dbname", config.Database.DBName)
	viper.SetDefault("database.sslmode", config.Database.SSLMode)
	
	viper.SetDefault("jwt.secret", config.JWT.Secret)
	viper.SetDefault("jwt.access_token_ttl", config.JWT.AccessTokenTTL)
	viper.SetDefault("jwt.refresh_token_ttl", config.JWT.RefreshTokenTTL)
	viper.SetDefault("jwt.issuer", config.JWT.Issuer)
}

func validateConfig(config *Config) error {
	if config.Server.Port < 1 || config.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", config.Server.Port)
	}
	
	if config.Database.Host == "" {
		return fmt.Errorf("database host cannot be empty")
	}
	
	if config.Database.User == "" {
		return fmt.Errorf("database user cannot be empty")
	}
	
	if config.Database.DBName == "" {
		return fmt.Errorf("database name cannot be empty")
	}
	
	if config.JWT.Secret == "" || config.JWT.Secret == "your-secret-key-change-in-production" {
		if config.Environment == "production" {
			return fmt.Errorf("JWT secret must be set in production")
		}
	}
	
	return nil
}