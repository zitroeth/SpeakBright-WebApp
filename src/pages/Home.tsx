import useAuth from '../hooks/useAuth';
import GuardianHome from './GuardianHome';

export default function Home() {
    const { currentUserType } = useAuth();

    switch (currentUserType) {
        case "guardian":
            return <GuardianHome />;
        case "admin":
            window.location.href = `/Home/Admin`;
            break;
        default:
            return <></>;
    }
}