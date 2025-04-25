export enum AvailableThemes {
    Dark = 'Dark',
    Bright = 'Bright'
}

export class Theme {
    static key = 'theme';

    static setTheme(theme: AvailableThemes) {
        localStorage.setItem(Theme.key, theme);
        const event = new StorageEvent('storage', {
            key: Theme.key,
            newValue: theme
        });
        window.dispatchEvent(event);
    }

    static getCurrentUser() {
        return localStorage.getItem(Theme.key) as AvailableThemes || AvailableThemes.Dark;
    }

    static removeCurrentUser() {
        localStorage.removeItem(Theme.key);
        const event = new StorageEvent('storage', {
            key: Theme.key,
            newValue: null
        });
        window.dispatchEvent(event);
    }

    static getChangeThemeListener(callback: (user: AvailableThemes) => void) {
        const callbackWrapper = (event: StorageEvent) => {
            if (event.key === Theme.key) {
                callback(event.newValue as AvailableThemes);
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
