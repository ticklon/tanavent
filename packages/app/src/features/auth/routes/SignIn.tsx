
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { AuthLayout } from '../components/AuthLayout';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom';

export const SignIn = () => {
    const { t } = useTranslation(['auth', 'common']);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                setError(t('auth:err.verify_required'));
                // Optionally sign out to prevent access
                // await auth.signOut(); 
                // But typically Firebase considers them signed in even if not verified, 
                // application logic often handles the block.
                // For strict requirement "Must verify email", we should block or show prompt.
            } else {
                // Success - navigation will be handled by the session listener in App.tsx typically
                // or we can redirect here manually
                window.location.href = "/"; // Simple reload/redirect for now
            }
        } catch (err: any) {
            console.error(err);
            setError(t('auth:err.signin_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('auth:title.signin')}>
            <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
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
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-tanavent-blue focus:border-tanavent-blue focus:z-10 sm:text-sm"
                            placeholder={t('auth:label.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tanavent-blue hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tanavent-blue ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('auth:action.signing_in') : t('auth:action.signin')}
                    </button>
                </div>

                <div className="text-center text-sm">
                    <span className="text-gray-500">{t('auth:link.no_account')} </span>
                    <a href="/signup" className="font-medium text-tanavent-blue hover:text-tanavent-blue-hover">
                        {t('auth:action.signup')}
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
};
