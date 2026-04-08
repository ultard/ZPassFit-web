'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import styles from './page.module.css'
import apiClient from '@/lib/api.client'
import { useAuthStore } from '@/store/auth.store'

export default function LoginPage() {
  const { setTokens } = useAuthStore()
  const { mutate: login } = apiClient.useMutation('post', '/auth/login', {
    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      })
    }
  })

  const handleLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    login({
      body: {
        email,
        password
      }
    })
  }

  return (
    <div>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Авторизация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formInputs}>
              <Input type="email" name="email" placeholder="Почта" />
              <Input type="password" name="password" placeholder="Пароль" />
            </div>
            <Button type="submit" className={styles.submitButton}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
