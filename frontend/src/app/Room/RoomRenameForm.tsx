import {useEffect, useState, type ChangeEvent, type ReactElement} from "react";
import {useParams} from "react-router";
import {useRoomAPI} from "@/domain/shared/context/RoomAPIContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import {RoomId} from "@/domain/Room/RoomId.ts";
import {TextField} from "@/comp/TextField/TextField.tsx";
import {Button} from "@/comp/Button/Button.tsx";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";

const MIN_NAME_LENGTH = 3;
const TOO_SHORT_ERROR = "ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)";
const NAME_TAKEN_SERVER_MESSAGE = "Room name already taken";
const TAKEN_ERROR = "ERR: ROOM_NAME_TAKEN — TRY ANOTHER";
const GENERIC_SERVER_ERROR = "SERVER ERR: PLEASE TRY AGAIN";

export function RoomRenameForm(): ReactElement {
    const {roomId} = useParams<{ roomId: string }>();
    const roomAPI = useRoomAPI();
    const router = useRouter();

    const [originalName, setOriginalName] = useState<string | null>(null);
    const [roomName, setRoomName] = useState("");
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        roomAPI.getRoom(RoomId.create(roomId!)).then((response) => {
            if (cancelled) return;
            if (!(response instanceof CommonError)) {
                setOriginalName(response.value.name);
                setRoomName(response.value.name);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [roomAPI, roomId]);

    const tooShort = roomName.length > 0 && roomName.length < MIN_NAME_LENGTH;
    const errorMessage = tooShort ? TOO_SHORT_ERROR : serverError;
    const unchanged = roomName === originalName;
    const canSubmit =
        roomName.length >= MIN_NAME_LENGTH &&
        !unchanged &&
        !isSubmitting &&
        !errorMessage;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setServerError(null);
        setRoomName(event.target.value);
    }

    async function handleSaveRename() {
        if (!canSubmit) return;
        setIsSubmitting(true);
        const response = await roomAPI.updateRoom(RoomId.create(roomId!), {name: roomName});
        if (response instanceof CommonError) {
            setServerError(response.message === NAME_TAKEN_SERVER_MESSAGE ? TAKEN_ERROR : GENERIC_SERVER_ERROR);
            setIsSubmitting(false);
            return;
        }
        router.push(`#/rooms/${roomId}`);
    }

    function handleCancel() {
        router.push(`#/rooms/${roomId}`);
    }

    return (
        <TerminalCard titleBarLabel="rename_room.sh" className="w-full max-w-[390px]">
            <div data-testid="roomRenameForm" className="flex flex-col gap-6 p-6">
                <TextField
                    data-testid="roomNameTextField"
                    label="ENTER_ROOM_NAME:"
                    hint="3–24 CHARS"
                    value={roomName}
                    onChange={handleChange}
                    errorMessage={errorMessage}
                    autoFocus
                    disabled={isSubmitting}
                />
                <div className="flex flex-col gap-2">
                    <Button
                        data-testid="saveRename"
                        disabled={!canSubmit}
                        loading={isSubmitting}
                        loadingText="SAVING"
                        onClick={handleSaveRename}
                        className="w-full"
                    >
                        SAVE_RENAME
                    </Button>
                    <Button
                        variant="ghost"
                        data-testid="cancel"
                        disabled={isSubmitting}
                        onClick={handleCancel}
                        className="w-full"
                    >
                        CANCEL
                    </Button>
                </div>
            </div>
        </TerminalCard>
    );
}
