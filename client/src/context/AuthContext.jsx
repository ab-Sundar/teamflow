import { createContext, useContext, useEffect, useState } from "react";
import {
    getCurrentUser,
    loginUser,
    registerUser,
} from "../services/authApi";

import {
    disconnectSocket,
} from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await getCurrentUser();
                setUser(data.user);
            } catch (error) {

                localStorage.removeItem("token");
                disconnectSocket();
                setUser(null);

            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (credentials) => {
        const data = await loginUser(credentials);

        localStorage.setItem("token", data.token);
        setUser(data.user);

        return data;
    };

    const register = async (userData) => {
        const data = await registerUser(userData);

        return data;
    };

    const logout = () => {
        /*
          Remove JWT first so a future socket
          connection cannot reuse it.
        */
        localStorage.removeItem("token");

        /*
          Close the authenticated realtime
          connection belonging to this user.
        */
        disconnectSocket();

        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};