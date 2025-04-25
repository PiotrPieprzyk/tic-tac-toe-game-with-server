import {UserAPIResponse} from "@/_modules/User/infra/UserAPI";

export class CurrentUser {
    static key = 'user';
    
    static setCurrentUser(user: UserAPIResponse) {
        localStorage.setItem(CurrentUser.key, JSON.stringify(user));
        const event = new StorageEvent('storage', {
            key: CurrentUser.key,
            newValue: JSON.stringify(user)
        });
        window.dispatchEvent(event);
    }
    
    static getCurrentUser() : UserAPIResponse | null {
        return JSON.parse(localStorage.getItem(CurrentUser.key) as string)?.value as UserAPIResponse || null;
    }
    
    static removeCurrentUser() {
        localStorage.removeItem(CurrentUser.key);
        const event = new StorageEvent('storage', {
            key: CurrentUser.key,
            newValue: null
        });
        window.dispatchEvent(event);
    }
    
    static getChangeUserListener(callback: (user: UserAPIResponse) => void) {
        const callbackWrapper = (event: StorageEvent) => {
            if (event.key === CurrentUser.key) {
                callback(JSON.parse(event.newValue as string)?.value as UserAPIResponse);
            }
        }
        
        window.addEventListener('storage', callbackWrapper);
        
        return {
            remove: () => {
                window.removeEventListener('storage', callbackWrapper);
            }
        }
    }
}
