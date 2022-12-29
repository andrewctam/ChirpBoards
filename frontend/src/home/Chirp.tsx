import { PostChirp } from "../App"
import Vote from "../boards/Vote"

function Chirp(props: PostChirp) {
    return (<li className="w-full relative mt-16 mb-4">
        <a href={`/profile/${props.authorUsername}`} className="absolute -top-8 left-2 z-10 bg-white text-black rounded-xl p-2 border border-black/20">
            {props.authorDisplayName}
            <div className="text-xs inline"> {`@${props.authorUsername}`} </div>
            <div className="text-xs"> {props.postDate} </div>
        </a>
        <a href={`/board/${props.id}`}>
            <div className="w-full relative p-10 pb-4 border border-black rounded-xl bg-slate-300 break-all">

                {props.text}
            </div>
        </a>
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp