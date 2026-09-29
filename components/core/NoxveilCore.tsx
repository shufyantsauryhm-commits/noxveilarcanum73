"use client"

import { useState } from "react"

import CoreHeader from "./CoreHeader"
import QuickActions from "./QuickActions"
import CommandInput from "./CommandInput"
import LiveMarketCard from "./LiveMarketCard"
import ParticleBackground from "./ParticleBackground"
import Orb from "./Orb"
import HoloStats from "./HoloStats"
import AIAnalysisPanel from "./AIAnalysisPanel"
import InstitutionalScanner from "./InstitutionalScanner"
import HologramGrid from "./HologramGrid"

import RiskCalculator from "./RiskCalculator"
import TradingJournal from "./TradingJournal"
import MarketAnalysis from "./MarketAnalysis"
import XAUDBias from "./XAUDBias"



export default function NoxveilCore(){


const [tool,setTool] = useState<string | null>(null)



return (

<section

className="
relative
mx-auto
max-w-5xl
overflow-visible
rounded-3xl
border
border-white/10
bg-gradient-to-br
from-zinc-950
via-black
to-purple-950/30
p-6
shadow-2xl
"

>


{/* BACKGROUND */}

<ParticleBackground />

<HologramGrid />



<div className="relative z-10">



{/* HEADER */}

<div className="mb-6">

<CoreHeader />

</div>





{/* ORB */}

<div className="mb-10">

<Orb />

<HoloStats />

</div>





{/* MARKET */}

<div className="mb-6">

<LiveMarketCard />

<AIAnalysisPanel />

<InstitutionalScanner />

</div>






{/* TOOLS */}

<div className="grid gap-5 md:grid-cols-2">



{/* QUICK ACTION */}

<QuickActions

onMarket={()=>setTool("market")}

onBias={()=>setTool("bias")}

onRisk={()=>setTool("risk")}

onJournal={()=>setTool("journal")}

/>






{/* COMMAND */}

<div

className="
rounded-2xl
border
border-white/10
bg-black/40
p-5
"

>


<div className="
mb-3
flex
items-center
justify-between
">

<h3 className="
text-sm
font-semibold
text-zinc-400
">

AI COMMAND CENTER

</h3>


<span className="
rounded-full
border
border-green-500/30
bg-green-500/10
px-3
py-1
text-xs
text-green-400
">

● ONLINE

</span>


</div>



<CommandInput />


</div>



</div>






{/* TOOL PANEL */}

{

tool && (

<div

className="
mt-6
rounded-3xl
border
border-white/10
bg-black/90
p-5
shadow-xl
"

>


<div className="
mb-5
flex
items-center
justify-between
">


<h2 className="
font-black
text-orange-400
">

NOXVEIL TOOL

</h2>



<button

onClick={()=>setTool(null)}

className="
rounded-lg
bg-white/10
px-4
py-2
text-xs
text-white
hover:bg-red-500/30
"

>

CLOSE

</button>


</div>





{

tool === "risk" && (

<RiskCalculator />

)

}




{

tool === "journal" && (

<TradingJournal />

)

}




{

tool === "market" && (

<MarketAnalysis />

)

}




{

tool === "bias" && (

<XAUDBias />

)

}




</div>

)

}



</div>


</section>


)

}