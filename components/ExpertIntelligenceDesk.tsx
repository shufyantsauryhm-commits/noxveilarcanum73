"use client"

import { motion } from "framer-motion"


const cards = [

{
title:"MARKET OVERVIEW",
items:[
["PAIR","XAUUSD"],
["TIMEFRAME","M1 - M5"],
["SESSION","NEW YORK"],
["VOLATILITY","NORMAL"],
["CONDITION","LIQUIDITY DEVELOPMENT"]
]
},


{
title:"MARKET STRUCTURE",
items:[
["CURRENT STRUCTURE","MONITORING"],
["PRICE ACTION","WAITING REACTION"],
["HIGHER TF","H4 / H1 CONTEXT"],
["LOWER TF","M5 ANALYSIS"]
]
},


{
title:"SMART MONEY MAP",
items:[
["RESISTANCE","AREA MONITORING"],
["SUPPORT","AREA MONITORING"],
["SUPPLY ZONE","SELLING INTEREST"],
["DEMAND ZONE","BUYING INTEREST"],
["LIQUIDITY","POOL DETECTION"]
]
},


{
title:"INSTITUTIONAL SCANNER",
items:[
["LIQUIDITY ANALYSIS","ACTIVE"],
["MARKET STRUCTURE","MONITORING"],
["VOLUME CONDITION","NORMAL"],
["SESSION ANALYSIS","NEW YORK"],
["VOLATILITY STATE","NORMAL"]
]
},


{
title:"RISK MANAGEMENT DESK",
items:[
["RISK FRAMEWORK","ACTIVE"],
["STOP FRAMEWORK","40-50 PIPS"],
["RISK PER TRADE","1-2%"],
["CAPITAL PROTECTION","ENABLED"]
]
},


{
title:"AI COMMAND CENTER",
items:[
["SYSTEM","ONLINE"],
["SCAN MARKET","Structure Analysis"],
["MARKET MAP","Zone Overview"],
["RISK TOOL","Risk Calculation"],
["JOURNAL","Performance Review"]
]
}

]



export default function ExpertIntelligenceDesk(){

return(

<div className="
space-y-8
">


<div className="
rounded-[35px]
border
border-cyan-500/20
bg-gradient-to-br
from-cyan-500/10
via-black
to-purple-950/30
p-8
">

<h1 className="
text-3xl
font-bold
tracking-widest
text-cyan-300
">

NOXVEIL EXPERT INTELLIGENCE DESK

</h1>


<p className="
mt-3
text-white/60
">

Advanced XAUUSD Market Workspace

</p>


</div>



<div className="
grid
md:grid-cols-2
gap-6
">


{
cards.map((card)=>(
<motion.div

key={card.title}

initial={{
opacity:0,
y:20
}}

animate={{
opacity:1,
y:0
}}

className="
rounded-3xl
border
border-white/10
bg-black/60
p-6
backdrop-blur-xl
"


>


<h2 className="
mb-5
text-cyan-300
font-bold
tracking-widest
">

{card.title}

</h2>


<div className="
space-y-3
">

{
card.items.map((item)=>(
<div
key={item[0]}
className="
flex
justify-between
border-b
border-white/5
pb-2
"

>

<span className="
text-white/50
text-sm
">

{item[0]}

</span>


<span className="
text-white
font-semibold
text-sm
">

{item[1]}

</span>


</div>
))
}

</div>


</motion.div>
))
}


</div>


</div>

)

}