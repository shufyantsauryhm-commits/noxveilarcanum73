"use client"

import { motion } from "framer-motion"
import { useMarketData } from "../hooks/useMarketData"


export default function ExpertMarketEngine(){

const market = useMarketData()


return(

<motion.section

initial={{opacity:0,y:20}}

animate={{opacity:1,y:0}}

className="
relative
overflow-hidden
rounded-[35px]
border
border-cyan-500/20
bg-gradient-to-br
from-cyan-500/10
via-black
to-purple-500/10
p-8
space-y-6
"

>


<h2 className="text-xl font-bold">
NOXVEIL AI MARKET MONITOR
</h2>


<div>

<p>XAUUSD</p>

<h1 className="text-4xl font-bold">
{market.price}
</h1>

<p>
{market.bid} / {market.ask}
</p>

</div>



<div className="grid md:grid-cols-3 gap-4">


<DataBox
title="CONFIDENCE"
value={`${market.confidence}%`}
/>


<DataBox
title="BIAS"
value={market.bias}
/>


<DataBox
title="SESSION"
value={market.session}
/>


</div>




<div className="grid md:grid-cols-2 gap-4">


<Panel
title="SUPPORT"
value={market.support}
/>


<Panel
title="RESISTANCE"
value={market.resistance}
/>


<Panel
title="SUPPLY ZONE"
value={market.supply}
/>


<Panel
title="DEMAND ZONE"
value={market.demand}
/>


<Panel
title="LIQUIDITY"
value={market.liquidity}
/>


<Panel
title="NEXT ACTION"
value={market.setup}
/>


</div>




<div className="grid md:grid-cols-3 gap-4">


<Panel
title="ENTRY"
value={market.entry}
/>


<Panel
title="TARGET"
value={market.target}
/>


<Panel
title="STOP LOSS"
value={market.stoploss}
/>


</div>



<div>


<h3 className="font-bold">
SCALPING DESK
</h3>


<Panel

title="TIMEFRAME"

value={market.timeframe}

/>


<Panel

title="MODE"

value={market.mode}

/>


</div>



<p className="text-sm">

LAST UPDATE : {market.update}

</p>


</motion.section>

)


}



function DataBox({

title,

value

}:{

title:string

value:string

}){


return(

<div className="
rounded-2xl
border
border-cyan-500/20
p-4
">

<p className="text-xs opacity-60">
{title}
</p>

<p className="text-xl font-bold">
{value}
</p>


</div>

)

}



function Panel({

title,

value

}:{

title:string

value:string

}){


return(

<div className="
rounded-2xl
border
border-white/10
p-4
">

<p className="text-xs opacity-60">
{title}
</p>

<p className="font-semibold">
{value || "---"}
</p>


</div>


)

}