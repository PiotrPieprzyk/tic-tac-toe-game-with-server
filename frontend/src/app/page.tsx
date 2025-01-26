'use client'

import React, {FormEvent} from "react";
import Button from "@/_modules/shared/components/Button/Button";
import TextInput from "@/_modules/shared/components/Input/TextInput";

import {UserAPI} from "@/_modules/User/infra/UserAPI";
import {UserName} from "@/_modules/User/domain/UserName";
import {ValueObjectRuleHandler} from "@/_modules/shared/validation/GenericRule";
import {redirect} from "next/navigation";


const rules = {
    UserName: [ValueObjectRuleHandler(UserName.create)]
}

export default function Home() {

    const [isFormValid, setIsFormValid] = React.useState(false);
    const formValidators: { [key: string]: boolean } = {};

    const onValidationChange = (name: string, isValid: boolean) => {
        formValidators[name] = isValid;
        setIsFormValid(Object.values(formValidators).every(Boolean));
    }

    // addUser will check the form data and console log UserName value
    const addUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const userName = formData.get('UserName') as string;

        if (!isFormValid) {
            return;
        }

        const user = await UserAPI.addUser({name: userName});
        // save user in local storage
        localStorage.setItem('user', JSON.stringify(user));
        
        redirect(`/rooms`);
    }


    return (
        <div className={'flex items-center justify-center flex-col color-app p-4 rounded-4 gap-6'}>
            <div className={'text-center'}>
                <h1 className={'text-display color-text-app mb-2 text-bold'}>Tic Tac Toe</h1>
                <p className={'text-body color-text-app'}>
                    Welcome to the tic tac toe game! <br/>
                    To login type user name and click JOIN!
                </p>
            </div>
            <form onSubmit={addUser} className={'w-full flex items-center justify-center flex-col gap-2'}>
                <TextInput
                    name={'UserName'}
                    placeholder={'User name...'}
                    onValidationChange={onValidationChange}
                    rules={rules.UserName}
                />
                <Button className={'px-5 py-1'} disabled={!isFormValid}>JOIN!</Button>
            </form>
        </div>
    );
}
