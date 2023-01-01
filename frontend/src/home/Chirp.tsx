import { PostChirp } from "../App"
import Vote from "../boards/Vote"


interface ChirpProps extends PostChirp {
    pinned?: boolean
}

function Chirp(props: ChirpProps) {
    return (<li className={`w-full relative mt-8`}>
        
            <div className="block bg-black/10 text-white p-1 rounded-tl-xl border border-b-0 truncate border-black ">
                <a href={`/profile/${props.authorUsername}`} className="text-xs ml-2 inline">{props.authorDisplayName}</a>
                <a href={`/profile/${props.authorUsername}`} className="text-xs m-0 inline h-fit"> {`• @${props.authorUsername}`} </a>
                <div className="text-xs inline"> {` • ${props.postDate}`} </div>
            </div>

            <a href={`/board/${props.id}`}>
                <div className={`w-full relative p-6 pt-3 border-black border border-t-0 rounded-br-xl break-all text-white ${props.pinned ? "bg-rose-400/25" : "bg-black/10" }`}>
                    {props.text}
                </div>
            </a>
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp