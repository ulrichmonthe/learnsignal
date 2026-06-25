import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-8 py-16">
      <SignUp
        appearance={{
          theme: dark,
          variables: {
            colorPrimary: '#C8F040',
            colorBackground: '#111110',
          },
        }}
      />
    </div>
  )
}
