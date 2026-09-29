"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"


export default function Orb(){

  const [bias,setBias] = useState("NEUTRAL")


  async function loadBias(){

    try{

      const res = await fetch(
        "/api/gold",
        {
          cache:"no-store"
        }
      )

      const data = await res.json()

      setBias(data.bias || "NEUTRAL")


    }catch{

      setBias("NEUTRAL")

    }

  }


  useEffect(()=>{

    loadBias()

    const timer=setInterval(
      loadBias,
      60000
    )

    return()=>clearInterval(timer)

  },[])



  const color =
  bias==="BULLISH"
  ?
  "cyan"
  :
  bias==="BEARISH"
  ?
  "red"
  :
  "purple"



return(

<div className="
relative
flex
h-72
items-center
justify-center
overflow-hidden
">


{/* Outer Reactor Ring */}

<motion.div

animate={{
rotate:360
}}

transition={{
duration:18,
repeat:Infinity,
ease:"linear"
}}

className={`
absolute
h-64
w-64
rounded-full
border
border-${color}-400/30
`}

/>



<motion.div

animate={{
rotate:-360
}}

transition={{
duration:12,
repeat:Infinity,
ease:"linear"
}}

className={`
absolute
h-52
w-52
rounded-full
border
border-${color}-400/20
`}

/>



{/* Particles */}

{
Array.from({
length:18
}).map((_,i)=>(

<motion.span

key={i}

animate={{

rotate:360,

}}

transition={{

duration:
6+i/2,

repeat:Infinity,

ease:"linear"

}}

style={{

transformOrigin:
"110px 110px"

}}

className={`
absolute
h-2
w-2
rounded-full
bg-${color}-400
shadow-lg
shadow-${color}-400
`}

/>

))

}



{/* Core */}

<motion.div

animate={{

scale:[
1,
1.08,
1

],

}}

transition={{

duration:2,

repeat:Infinity

}}

className={`
relative
flex
h-32
w-32
items-center
justify-center
rounded-full
bg-black
border-4
border-${color}-400
shadow-2xl
`}

>


<div
className={`
absolute
inset-0
rounded-full
bg-${color}-400/20
blur-2xl
`}
/>


<span className="
relative
z-10
text-xl
font-black
text-white
">



</span>


</motion.div>


{/* Label */}

<div className="
absolute
bottom-4
text-center
">

<p className="
text-[10px]
tracking-[0.5em]
text-zinc-500
">

AI REACTOR

</p>


<p className={`
mt-1
text-sm
font-black
${
color==="cyan"
?
"text-cyan-400"
:
color==="red"
?
"text-red-400"
:
"text-purple-400"
}
`}>

{bias}

</p>


</div>


</div>

)

}