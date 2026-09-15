import type {ReactElement} from "react";
import {useUserAPI} from "@/domain/shared/context/UserAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";

export function UserForm(): ReactElement {
    useUserAPI();
    useRouter();

    return (
        <div>
            <h2>Room List</h2>
        </div>
    );
}
