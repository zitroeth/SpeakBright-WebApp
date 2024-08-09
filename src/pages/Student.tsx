import { useParams } from "react-router-dom";

export default function Student() {
    const { id } = useParams();
    console.log(id);

    return (
        <>
        </>
    );
}