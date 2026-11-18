interface AppLaunchWindow extends Window {
 launchQueue?: {setConsumer:(consumer:(params:{targetURL?:string})=>void)=>void};
}
/** Reactivation focuses the existing workspace without navigating away from drafts. */
export function registerAppLaunch(){
 (window as AppLaunchWindow).launchQueue?.setConsumer(()=>{window.focus();});
}
