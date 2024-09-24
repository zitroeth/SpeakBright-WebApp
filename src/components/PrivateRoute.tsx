import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

interface PrivateRouteProps {
    children: ReactNode;
    redirectLink?: string;
}

export default function PrivateRoute({ children, redirectLink = '/Login' }: PrivateRouteProps) {
    const { currentUser } = useAuth();
    console.log("currentUser\n")
    console.log(currentUser)
    return currentUser ? children : <Navigate to={redirectLink} />;
}