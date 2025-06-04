import { jwtDecode } from 'jwt-decode';
import { JwtClaims, UserInfo } from '../types';

/**
 * Decode JWT token và extract thông tin user
 */
export function decodeJwtToken(token: string): JwtClaims | null {
  try {
    return jwtDecode<JwtClaims>(token);
  } catch (error) {
    console.error('❌ JWT decode error:', error);
    return null;
  }
}

/**
 * Extract thông tin user từ JWT claims
 */
export function extractUserInfo(token: string): UserInfo | null {
  try {
    const claims = decodeJwtToken(token);
    if (!claims) return null;

    return {
      userName: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
      userFullName: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || null,
      companyName: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/system'] || null,
    };
  } catch (error) {
    console.error('❌ Extract user info error:', error);
    return null;
  }
}

/**
 * Kiểm tra token có expired không
 */
export function isTokenExpired(token: string): boolean {
  try {
    const claims = decodeJwtToken(token);
    if (!claims || !claims.exp) return true;

    const currentTime = Date.now() / 1000;
    return claims.exp < currentTime;
  } catch (error) {
    console.error('❌ Check token expiration error:', error);
    return true;
  }
}

/**
 * Lấy thời gian hết hạn của token
 */
export function getTokenExpirationDate(token: string): Date | null {
  try {
    const claims = decodeJwtToken(token);
    if (!claims || !claims.exp) return null;

    return new Date(claims.exp * 1000);
  } catch (error) {
    console.error('❌ Get token expiration error:', error);
    return null;
  }
} 