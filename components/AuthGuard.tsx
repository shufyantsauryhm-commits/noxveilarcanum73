"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({
children,
role
}:{
children:React.ReactNode
role:"member"|"expert"
}){

const router = useRouter()

const [loading,setLoading]=useState(true)


useEffect(()=>{

const userRole =
localStorage.getItem("role")


if(!userRole){

router.push("/login")
return

}


if(
role==="expert" &&
userRole!=="expert"
){

router.push("/member")
return

}


setLoading(false)


},[])



if(loading){

return(
<div className="
min-h-screen
bg-black
text-white
flex
items-center
justify-center
">
AUTHENTICATING...
</div>
)

}


return children

}