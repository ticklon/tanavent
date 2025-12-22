
import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { AuthLayout } from '../components/AuthLayout';
import { useTranslation } from 'react-i18next';
// We'll add navigation later
// import { useNavigate } from 'react-router-dom'; 

export const SignUp = () => {
    const { t } = useTranslation(['auth', 'common']); // Assuming we'll add 'auth' namespace later
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Sync user to database
            const token = await userCredential.user.getIdToken();
            const { createAuthClient } = await import('../../../lib/client');
            const client = createAuthClient(token);

            const res = await client.api.users.$post();
            if (!res.ok) {
                // Log error but proceed to verification email sending as auth is successful
                console.error('Failed to sync user to database');
            }

            await sendEmailVerification(userCredential.user);
            setVerificationSent(true);
        } catch (err: any) {
            console.error(err);
            // Improving error messages would be good later
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <AuthLayout title={t('auth:title.verify')}>
                <div className="text-center space-y-4">
                    <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t('auth:msg.verify_sent', { email }) }} />
                    <p className="text-sm text-gray-500">
                        {t('auth:msg.verify_check')}
                    </p>
                    <button
                        onClick={() => window.location.reload()} // Simple way to reset or check status
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tanavent-blue hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tanavent-blue"
                    >
                        {t('auth:msg.return_signin')}
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={t('auth:title.signup')}>
            <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="email-address" className="sr-only">{t('auth:label.email')}</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-tanavent-blue focus:border-tanavent-blue focus:z-10 sm:text-sm"
                            placeholder={t('auth:label.email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">{t('auth:label.password')}</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-tanavent-blue focus:border-tanavent-blue focus:z-10 sm:text-sm"
                            placeholder={t('auth:label.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {t('auth:err.signup_failed')}: {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tanavent-blue hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tanavent-blue ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('auth:action.signing_up') : t('auth:action.signup')}
                    </button>
                </div>

                <div className="text-center text-sm">
                    <span className="text-gray-500">{t('auth:link.has_account')} </span>
                    <a href="/login" className="font-medium text-tanavent-blue hover:text-tanavent-blue-hover">
                        {t('auth:action.signin')}
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
};
