export default function Card({
    children,
}:{
    children:React.ReactNode
}){

return(

<div className="rounded-2xl bg-[#111111] border border-zinc-800 p-6">

{children}

</div>

)

}