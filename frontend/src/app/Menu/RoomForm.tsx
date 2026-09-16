import {useState, type ChangeEvent, type ReactElement} from "react";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {TextField} from "@/comp/TextField/TextField.tsx";
import {Button} from "@/comp/Button/Button.tsx";

const MIN_NAME_LENGTH = 3;
const TOO_SHORT_ERROR = "ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)";
const NAME_TAKEN_SERVER_MESSAGE = "Room name already taken";
const USER_ALREADY_CREATED_ROOM_SERVER_MESSAGE = "User already created room";
const USER_ALREADY_CREATED_ROOM_ERROR = "ERR: USER_ALREADY_CREATED_ROOM — CLICK CANCEL";
const TAKEN_ERROR = "ERR: ROOM_NAME_TAKEN — TRY ANOTHER";
const GENERIC_SERVER_ERROR = "SERVER ERR: PLEASE TRY AGAIN";

export function RoomForm(): ReactElement {
    const roomAPI = useRoomAPI();
    const router = useRouter();
    const currentUserId = useUserSession();
    const [roomName, setRoomName] = useState("");
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tooShort = roomName.length > 0 && roomName.length < MIN_NAME_LENGTH;
    const errorMessage = tooShort ? TOO_SHORT_ERROR : serverError;
    const canSubmit =
        roomName.length >= MIN_NAME_LENGTH &&
        !isSubmitting &&
        (!errorMessage || errorMessage === GENERIC_SERVER_ERROR);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setServerError(null);
        setRoomName(event.target.value);
    }

    async function handleCreateRoom() {
        if (!canSubmit) return;
        setIsSubmitting(true);
        const response = await roomAPI.addRoom({name: roomName, hostId: currentUserId, usersIds: [currentUserId]});
        if (response instanceof CommonError) {
            const message = response.message;
            if(message === USER_ALREADY_CREATED_ROOM_SERVER_MESSAGE) {
                setServerError(USER_ALREADY_CREATED_ROOM_ERROR);
            } else if(message === NAME_TAKEN_SERVER_MESSAGE) {
                setServerError(TAKEN_ERROR);
            } else {
                setServerError(GENERIC_SERVER_ERROR);
            }

            setIsSubmitting(false);
            return;
        }
        router.push(`#/rooms/${response.value.id}`);
    }

    return (
        <div data-testid="roomForm">
            <TextField
                data-testid="roomNameTextField"
                value={roomName}
                onChange={handleChange}
                errorMessage={errorMessage}
                autoFocus
                disabled={isSubmitting}
            />
            <Button
                data-testid="createRoom"
                disabled={!canSubmit}
                loading={isSubmitting}
                loadingText="CREATING"
                onClick={handleCreateRoom}
            >
                CREATE_ROOM
            </Button>
            <Button
                variant="ghost"
                data-testid="cancel"
                disabled={isSubmitting}
                onClick={() => router.push('#/rooms')}
            >
                CANCEL
            </Button>
        </div>
    );
}
