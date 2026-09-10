import type {ReactElement} from "react";
import {useUserAPI} from "../../infra/api/UserAPIContext.tsx";
import {useRouter} from "../../infra/service/RouterContext.tsx";

export function UserForm(): ReactElement {
    useUserAPI();
    useRouter();

    return (
        <div>
            <h2>Room List</h2>
        </div>
    );
}
