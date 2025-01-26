import {UIError} from "@/_modules/shared/models/UIError";

export const ValueObjectRuleHandler = (callback: any ) => {
    return (value: unknown) => {
        try {
            callback(value)
            return true
        } catch (e) {
            if (e instanceof UIError) {
                return e.message
            }
            return 'Unknown error'
        }
    }
   
}
