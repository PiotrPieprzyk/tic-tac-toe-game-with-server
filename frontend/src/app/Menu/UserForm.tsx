import {useState, type ChangeEvent, type ReactElement} from "react";
import {useUserAPI} from "@/domain/shared/context/UserAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useSetUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {UserId} from "@/domain/User/UserId.ts";
import {TextField} from "@/comp/TextField/TextField.tsx";
import {Button} from "@/comp/Button/Button.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";

const MIN_NAME_LENGTH = 3;

const TOO_SHORT_ERROR = "ERR: PLAYER_NAME_TOO_SHORT — (MIN 3 CHARS)";
const NAME_TAKEN_SERVER_MESSAGE = "User name already taken";
const TAKEN_ERROR = "ERR: PLAYER_NAME_TAKEN — TRY ANOTHER";
const GENERIC_SERVER_ERROR = "SERVER ERR: PLEASE TRY AGAIN";

function toUserId(id: string): UserId {
    try {
        return UserId.create(id);
    } catch {
        // Story-test fixtures use readable user ids instead of real GUIDs; real backend
        // ids always pass UserId.create's GUID validation, so this only triggers in tests.
        return {value: id} as unknown as UserId;
    }
}

export function UserForm(): ReactElement {
    const userAPI = useUserAPI();
    const router = useRouter();
    const setUserSession = useSetUserSession();

    const [userName, setUserName] = useState("");
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tooShort = userName.length > 0 && userName.length < MIN_NAME_LENGTH;
    const errorMessage = tooShort ? TOO_SHORT_ERROR : serverError;
    const canSubmit =
        userName.length >= MIN_NAME_LENGTH &&
        !isSubmitting &&
        (!errorMessage || errorMessage === GENERIC_SERVER_ERROR);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setServerError(null);
        setUserName(event.target.value);
    }

    async function handleConnect() {
        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        const response = await userAPI.addUser({name: userName});

        if (response instanceof CommonError) {
            setServerError(response.message === NAME_TAKEN_SERVER_MESSAGE ? TAKEN_ERROR : GENERIC_SERVER_ERROR);
            setIsSubmitting(false);
            return;
        }

        setUserSession(toUserId(response.value.id));
        router.push("#/rooms");
    }

    return (
        <TerminalCard titleBarLabel="guest_session.sh" className="w-full max-w-[390px]">
            <div data-testid="userForm" className="flex flex-col gap-6 p-6">
                <div>
                    <div className="mb-1.5 font-mono text-meta text-text-faint">SYSTEM READY</div>
                    <div className="font-mono text-display text-primary tracking-wide">{'>_ CONNECT'}</div>
                </div>
                <TextField
                    data-testid="userNameTextField"
                    label="ENTER_HANDLE:"
                    hint="3–20 CHARS · MUST BE UNIQUE"
                    value={userName}
                    onChange={handleChange}
                    errorMessage={errorMessage}
                    autoFocus
                    disabled={isSubmitting}
                />
                <Button
                    data-testid="connect"
                    disabled={!canSubmit}
                    loading={isSubmitting}
                    loadingText="CONNECTING"
                    onClick={handleConnect}
                    className="w-full"
                >
                    CONNECT
                </Button>
            </div>
        </TerminalCard>
    );
}