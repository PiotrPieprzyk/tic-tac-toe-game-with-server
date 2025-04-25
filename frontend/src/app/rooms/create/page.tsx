'use client'

import React, {FormEvent, useState} from "react";
import Button from "@/_modules/shared/components/Button/Button";
import TextInput from "@/_modules/shared/components/Input/TextInput";

import {ValueObjectRuleHandler} from "@/_modules/shared/validation/GenericRule";
import {RoomName} from "@/_modules/Room/domain/RoomName";
import {RoomAPI} from "@/_modules/Room/infra/RoomApi";
import {CommonError} from "@/_modules/shared/api/API";
import {redirect} from "next/navigation";
import {useRouter} from "next/navigation";
import {CurrentRoom} from "@/_modules/Room/domain/CurrentRoom";
import {Room} from "@/_modules/Room/domain/Room";


const rules = {
    RoomName: [ValueObjectRuleHandler(RoomName.create)]
}

const roomAPI = new RoomAPI();
const currentRoom = new CurrentRoom();

export default function CreateRoom() {
    const router = useRouter()
    const [isFormValid, setIsFormValid] = useState(false);
    const formValidators: { [key: string]: boolean } = {};
    const [serverError, setServerError] = useState<string | null>(null);

    const onValidationChange = (name: string, isValid: boolean) => {
        formValidators[name] = isValid;
        setIsFormValid(Object.values(formValidators).every(Boolean));
    }

    // addUser will check the form data and console log UserName value
    const addRoom = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const roomName = formData.get('RoomName') as string;

        if (!isFormValid) {
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('user') as string).value;

        const response = await roomAPI.addRoom({
            name: roomName,
            // TODO: Do someting with my_user
            usersIds: [user.id],
            hostId: user.id
        });

        if(response instanceof CommonError) {
            setServerError(response.message);
            return;
        }
        
        setServerError(null);
        currentRoom.setCurrentRoom(Room.create({...response.value, roomAPI}));
        router.push(`/rooms/${response.value.id}`);
    }


    return (
        <div className={'flex flex-col color-app color-text-app p-4 rounded-4 gap-3'}>
                <h1 className={'text-title text-bold'}>Create room</h1>
            <form onSubmit={addRoom} className={'w-full flex flex-col gap-3'}>
                <TextInput
                    name={'RoomName'}
                    placeholder={'Room name...'}
                    onValidationChange={onValidationChange}
                    rules={rules.RoomName}
                />
                
                {serverError && <p className={'color-text-app-error'}>{serverError}</p>}
                
                <Button className={'px-5 py-1'} disabled={!isFormValid}>Create</Button>
            </form>
        </div>
    );
}
