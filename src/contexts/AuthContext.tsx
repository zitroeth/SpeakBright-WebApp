import { createContext, useEffect } from 'react';
import { useState, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { getUserName, getUserType } from '../functions/query';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentUserType, setCurrentUserType] = useState<string | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            setCurrentUser(user);
            if (user) {
                const userType = await getUserType(user.uid);
                setCurrentUserType(userType);
                const userName = await getUserName(user.uid);
                setCurrentUserName(userName);
            }
            setLoading(false);
        })
        return unsubscribe;
    }, [])

    const value = {
        currentUser,
        currentUserType,
        currentUserName,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

const AuthContext = createContext<{
    // Type
    currentUser: User | null,
    currentUserType: string | null,
    currentUserName: string | null
}>({
    // Initial Value
    currentUser: null,
    currentUserType: null,
    currentUserName: null,
});
export default AuthContext;