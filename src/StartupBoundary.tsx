import React from 'react';
export class StartupBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error){console.error('Shiye could not render',error);}
 render(){if(this.state.failed)return <main className="load-error" role="alert"><h2>拾頁暫時無法顯示</h2><p>原有文獻未被清除。請先重新載入；若仍無法開啟，可使用保留資料的修復入口。</p><button onClick={()=>location.reload()}>重新載入</button><p><a href="./restore-app.html">修復開啟（保留文獻）</a></p></main>;return this.props.children;}
}
