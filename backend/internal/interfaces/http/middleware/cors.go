package middleware

import (
	"fmt"
	
	"github.com/gin-gonic/gin"
	"github.com/chun-wei0413/pingnom/internal/infrastructure/config"
)

func CORS(config *config.Config) gin.HandlerFunc {
	corsConfig := config.Server.CORS
	
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// 檢查是否允許該來源
		finalOrigin := "*"
		for _, allowedOrigin := range corsConfig.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				finalOrigin = allowedOrigin
				break
			}
		}
		
		c.Header("Access-Control-Allow-Origin", finalOrigin)
		
		if corsConfig.AllowCredentials {
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		
		// 設定允許的方法
		if len(corsConfig.AllowedMethods) > 0 {
			methods := ""
			for i, method := range corsConfig.AllowedMethods {
				if i > 0 {
					methods += ", "
				}
				methods += method
			}
			c.Header("Access-Control-Allow-Methods", methods)
		}
		
		// 設定允許的標頭
		if len(corsConfig.AllowedHeaders) > 0 {
			headers := ""
			for i, header := range corsConfig.AllowedHeaders {
				if i > 0 {
					headers += ", "
				}
				headers += header
			}
			c.Header("Access-Control-Allow-Headers", headers)
		}
		
		// 設定暴露的標頭
		if len(corsConfig.ExposedHeaders) > 0 {
			headers := ""
			for i, header := range corsConfig.ExposedHeaders {
				if i > 0 {
					headers += ", "
				}
				headers += header
			}
			c.Header("Access-Control-Expose-Headers", headers)
		}
		
		// 設定預檢請求快取時間
		if corsConfig.MaxAge > 0 {
			c.Header("Access-Control-Max-Age", fmt.Sprintf("%d", corsConfig.MaxAge))
		}
		
		// 處理預檢請求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}