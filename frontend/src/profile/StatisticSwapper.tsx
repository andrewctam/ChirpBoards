
import { Feed } from "./Profile";


interface StatisticSwapperProps {
    selectedFeed: Feed,
    switchFeeds: (view: Feed) => void,
    type: Feed,
    text: string,
}

const StatisticSwapper = (props: StatisticSwapperProps) => {
    return (
        <div className={`w-fit mx-auto cursor-pointer select-none ${props.selectedFeed === props.type ? "underline text-sky-800" : "text-black"}`} 
            onClick={() => props.switchFeeds(props.type)}>

            {props.text}
        </div>
    )
}



export default StatisticSwapper;
