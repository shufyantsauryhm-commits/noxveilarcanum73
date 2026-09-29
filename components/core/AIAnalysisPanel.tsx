"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap
} from "lucide-react"


export default function AIAnalysisPanel(){

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)


  async function loadAnalysis(){

    try{

      setLoading(true)

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
    finally{

      setLoading(false)

    }

  }



  useEffect(()=>{

    loadAnalysis()

    const timer=setInterval(
      loadAnalysis,
      60000
    )


    return()=>clearInterval(timer)


  },[])



  const cards = [

    {
      title:"XAUUSD",
      value:data
      ?
      `$${Number(data.price).toFixed(2)}`
      :
      "Loading...",
      icon:Activity,
      color:"text-amber-400"
    },


    {
      title:"AI BIAS",
      value:data?.bias || "ANALYZING",
      icon:
      data?.bias==="BULLISH"
      ?
      TrendingUp
      :
      data?.bias==="BEARISH"
      ?
      TrendingDown
      :
      Minus,
      color:
      data?.bias==="BULLISH"
      ?
      "text-emerald-400"
      :
      data?.bias==="BEARISH"
      ?
      "text-red-400"
      :
      "text-yellow-400"
    },


    {
      title:"TREND",
      value:data?.trend || "WAITING",
      icon:Zap,
      color:"text-cyan-400"
    },


    {
      title:"VOLATILITY",
      value:data?.volatility || "WAITING",
      icon:Activity,
      color:"text-orange-400"
    },


    {
      title:"CONFIDENCE",
      value:data
      ?
      `${data.confidence}%`
      :
      "0%",
      icon:Shield,
      color:"text-purple-400"
    }


  ]



return(

<motion.section

initial={{
opacity:0,
y:20
}}

animate={{
opacity:1,
y:0
}}

className="
mt-6
rounded-3xl
border
border-purple-500/20
bg-black/50
p-5
backdrop-blur-xl
"

>


<div className="
mb-5
flex
items-center
justify-between
">


<div>

<p className="
text-xs
tracking-[0.3em]
text-purple-400
">

NOXVEIL AI CORE

</p>


<h2 className="
text-xl
font-black
text-white
">

MARKET ANALYSIS

</h2>


</div>


<div className="
text-xs
text-green-400
">

● LIVE ENGINE

</div>


</div>



<div className="
grid
gap-3
md:grid-cols-5
">


{cards.map((item)=>(

<div
key={item.title}
className="
rounded-xl
border
border-white/10
bg-white/5
p-4
"
>


<item.icon
className={`
h-4
w-4
${item.color}
`}
/>


<p className="
mt-3
text-[10px]
text-zinc-500
">

{item.title}

</p>


<p className={`
mt-1
text-sm
font-bold
${item.color}
`}>

{loading
?
"Loading..."
:
item.value
}

</p>


</div>


))}


</div>



<div className="
mt-5
rounded-xl
border
border-white/10
bg-black/40
p-3
">


<p className="
text-xs
text-zinc-400
">

INSTITUTIONAL SIGNAL

</p>


<div className="
mt-2
h-2
overflow-hidden
rounded-full
bg-zinc-800
">

<div

style={{
width:`${data?.confidence || 0}%`
}}

className="
h-full
bg-purple-500
"

/>

</div>


</div>


</motion.section>

)

}