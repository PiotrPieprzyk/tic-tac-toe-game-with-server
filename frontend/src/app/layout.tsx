'use client';

import {useEffect, useState, ReactNode} from "react";

import "@/_modules/shared/css/globals.css";
import "@/_modules/shared/css/color-theme.css"
import "@/_modules/shared/css/typology.css"
import {CurrentUser} from "@/_modules/shared/services/CurrentUser";
import {AvailableThemes, Theme} from "@/_modules/shared/services/Theme";
import Button from "@/_modules/shared/components/Button/Button";
import {useRouter} from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
    const router = useRouter();
    const [user, setUser] = useState(CurrentUser.getCurrentUser());
    const [theme, setTheme] = useState(Theme.getCurrentUser());
    
    useEffect(() => {
        const changeUserListener = CurrentUser.getChangeUserListener((user) => {
            setUser(user);
        })
        
        const changeThemeListener = Theme.getChangeThemeListener((theme) => {
            setTheme(theme);
        });
        
        return () => {
            changeUserListener.remove();
            changeThemeListener.remove();
        }
    })
    
    const onLogout = () => {
        setUser(null);
        CurrentUser.removeCurrentUser();
        router.push('/');
    }
    
    const onThemeChange = () => {
        const newTheme = theme === AvailableThemes.Dark ? AvailableThemes.Bright : AvailableThemes.Dark;
        Theme.setTheme(newTheme);
        
    }
    
    const themeClass = theme === AvailableThemes.Dark ? 'theme-dark' : 'theme-bright';
    
    
    
    const [isAppErrorVisible, setAppErrorVisible] = useState(false);
    const appErrorVisibleClass = isAppErrorVisible ? 'app-error-visible' : '';

    return (
        <html lang="en">
        <body
            className={`antialiased ${themeClass} color-bg`}
        >
        <div className={'color-bg app-holder flex justify-center items-center p-3'}>
            {user && (
                <div className={'color-app app-header px-3 py-2 level-1 flex items-center w-full'}>
                    <div className={'px-4 flex items-center justify-between w-full'}>
                        <h1 className={'text-title color-text-app'}>{user.name}</h1>
                        <div className={'flex items-center gap-2'}>
                            <Button onClick={() => onThemeChange()} className={'px-2 py-1'} flat={true}>
                                Change Theme
                            </Button>
                            <Button onClick={() => onLogout()} className={'px-2 py-1'} flat={true}>
                                Logout
                            </Button>
                        </div>
                    </div>

                </div>
            )}
            <div className="app-content">
                {children}
            </div>

            <div className={`${appErrorVisibleClass} color-app app-error px-3 py-2 level-1 flex items-center rounded-4`}>
                <div className={'flex items-center flex-1'}>
                    <div className={'color-label-error color-text-label rounded-2 mr-2'} style={{width: '24px', height: '24px'}}>
                        <img src={'/icons/connection-error.svg'} alt={'Error icon'}/>
                    </div>
                    <span className={'text-body color-text-app'}>Connection error. Please try again</span>
                </div>

                <Button onClick={()=> setAppErrorVisible(false)} className={'px-2 py-1'}>Retry</Button>
            </div>
        </div>
        </body>
        </html>
    );
}
