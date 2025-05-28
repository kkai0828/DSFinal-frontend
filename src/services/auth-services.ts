import axios from 'axios'
// 更新 API_URL 定义，优先使用 REACT_APP_API_URL，回退到 'http://localhost'
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost';

type LoginRes = {
  error: string | null
  data: string
}

// 定义注册请求的数据接口
interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  role: string;
  phone_number: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginRes> {
    const res = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (res.status != 200) {
      const errMessage = await res.text()
      const err: LoginRes = { error: errMessage, data: '' }
      return new Promise<LoginRes>((resolve) => {
        resolve(err)
      })
    }
    const sucMessage = await res.json()
    const suc: LoginRes = {
      error: null,
      data: JSON.stringify(sucMessage),
    }
    return suc
  }

  async register(userData: RegisterPayload) {
    // 修改端点为 API_URL + '/auth/'，并发送 JSON 数据
    return await axios.post(API_URL + '/auth/', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async changePassword(
    jwt_token: string,
    oldPassword: string,
    newPassword: string
  ) {
    return await axios.patch(
      API_URL + '/auth/change-password',
      { oldPassword: oldPassword, newPassword: newPassword },
      {
        headers: { Authorization: 'Bearer ' + jwt_token },
      }
    )
  }
}

export default new AuthService()

