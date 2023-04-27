
import { SelectedFeed } from "./Profile";


interface StatisticSwapperProps {
    viewSelected: SelectedFeed,
    setViewSelected: (view: SelectedFeed) => void,
    type: SelectedFeed,
    text: string,
}

const StatisticSwapper = (props: StatisticSwapperProps) => {
    return (
        <div className={`w-fit mx-auto cursor-pointer select-none ${props.viewSelected === props.type ? "underline text-sky-800" : "text-black"}`} 
            onClick={() => props.setViewSelected(props.type)}>

            {props.text}
        </div>
    )
}



export default StatisticSwapper;
