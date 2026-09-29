"use client"

import { 
  Brain,
  TrendingUp,
  Waves,
  Target
} from "lucide-react"

import { useEffect, useState } from "react"


export default function XAUDBias(){

  const [data,setData] = useState<any>(null)


  async function load(){

    try{

      const res = await fetch(
        "/api/gold",
        {
          cache:"no-store"
        }
      )

      const json = await res.json()

      setData(json)

    }catch(error){

      console.log(error)

    }

  }


  useEffect(()=>{

    load()

    const timer=setInterval(
      load,
      5000
    )

    return()=>clearInterval(timer)

  },[])



  if(!data){

    return(
      <div className="
      rounded-3xl
      border
      border-cyan-500/30
      bg-black
      p-6
      text-cyan-400
      ">
        SCANNING MARKET...
      </div>
    )

  }



return(

<div
className="
rounded-3xl
border
border-cyan-500/30
bg-gradient-to-br
from-black
via-zinc-950
to-purple-950/30
p-6
shadow-xl
"
>


<div className="
flex
items-center
gap-3
mb-6
">

<Brain
className="text-cyan-400"
/>


<div>

<h2 className="
text-xl
font-black
text-white
">

NOXVEIL AI CORE

</h2>

<p className="
text-xs
tracking-widest
text-cyan-400
">

XAUUSD INTELLIGENCE

</p>

</div>


</div>




<div className="
grid
gap-4
md:grid-cols-2
">



<div className="
rounded-2xl
border
border-white/10
bg-white/5
p-4
">

<p className="
text-xs
text-zinc-500
">

AI BIAS

</p>

<p className={`
mt-2
text-2xl
font-black
${data.bias==="BUY"
?"text-green-400"
:data.bias==="SELL"
?"text-red-400"
:"text-yellow-400"}
`}>

{data.bias}

</p>

</div>





<div className="
rounded-2xl
border
border-white/10
bg-white/5
p-4
">

<p className="
text-xs
text-zinc-500
">

CONFIDENCE

</p>


<p className="
mt-2
text-2xl
font-black
text-cyan-400
">

{data.confidence}%

</p>


<div className="
mt-3
h-2
rounded-full
bg-zinc-800
overflow-hidden
">

<div
style={{
width:`${data.confidence}%`
}}
className="
h-full
bg-cyan-400
"
/>

</div>


</div>





<div className="
rounded-2xl
border
border-white/10
bg-white/5
p-4
">

<TrendingUp
className="text-green-400"
/>


<p className="
mt-2
text-xs
text-zinc-500
">

MARKET STRUCTURE

</p>


<p className="
font-bold
text-white
">

{data.structure}

</p>


</div>





<div className="
rounded-2xl
border
border-white/10
bg-white/5
p-4
">

<Waves
className="text-purple-400"
/>


<p className="
mt-2
text-xs
text-zinc-500
">

MOMENTUM

</p>


<p className="
font-bold
text-white
">

{data.momentum}

</p>


</div>



</div>





<div className="
mt-5
rounded-2xl
border
border-orange-500/30
bg-orange-500/10
p-4
">


<Target
className="text-orange-400"
/>


<p className="
text-xs
text-orange-300
mt-2
">

EXECUTION MODEL

</p>


<p className="
font-bold
text-white
">

{data.bias==="BUY"
?"BUY ON RETRACEMENT"
:data.bias==="SELL"
?"SELL ON RETEST"
:"WAIT FOR CONFIRMATION"}

</p>


</div>




<div className="
mt-5
rounded-2xl
border
border-cyan-500/20
bg-cyan-500/5
p-4
">

<p className="
text-xs
text-cyan-400
">

AI VERDICT

</p>


<p className="
mt-2
text-zinc-200
">

{
data.bias==="BUY"
?
"Buyers are controlling the current market structure."
:
data.bias==="SELL"
?
"Sellers are dominating price movement."
:
"Market is waiting for a stronger confirmation."
}

</p>


</div>




</div>

)

}