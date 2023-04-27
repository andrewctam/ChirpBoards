
import { useState, useContext, useEffect } from "react";
import { PostPayload, UserContext, UserPayload } from "../App";
import Chirp, { Rechirper } from "../home/Chirp";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";
import UserSearchResult from "../menus/UserSearchResult";
import ChirpPlaceholder from "../placeholders/ChirpPlaceholder";
import SpinningCircle from "../SpinningCircle";
import { SelectedFeed } from "./Profile";

interface ProfileFeedProps {
    username: string
    postCount: number
    selectedFeed: SelectedFeed
    userColor: string
    editingColor: boolean
}

function ProfileFeed(props: ProfileFeedProps) {
    const userInfo = useContext(UserContext);

    const [doneFetching, setDoneFetching] = useState(false);

    const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);

    const [chirps, setChirps] = useState<JSX.Element[]>([]);
    const [chirpsPageNum, setChirpsPageNum] = useState(0);
    const [chirpsHasNextPage, setChirpsHasNextPage] = useState(true);

    const [followers, setFollowers] = useState<JSX.Element[]>([]);
    const [followersPageNum, setFollowersPageNum] = useState(0);
    const [followersHasNextPage, setFollowersHasNextPage] = useState(true);

    const [following, setFollowing] = useState<JSX.Element[]>([]);
    const [followingPageNum, setFollowingPageNum] = useState(0);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);



    useEffect(() => {
        if (props.username && props.postCount > 0) {
            getChirps(); // separate getting chirps to speed up initial load
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (props.selectedFeed !== SelectedFeed.Chirps) {
            getFollow();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedFeed])


    const getChirps = async () => {
        if (!chirpsHasNextPage) {
            return;
        }

        setDoneFetching(false);
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
            `query {    
            user(username: "${props.username}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                ${chirpsPageNum === 0 ? 
                `pinnedPost {
                    author {
                        username
                        displayName
                        userColor
                        pictureURL   
                    }
                    id
                    text
                    isEdited
                    imageURL
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                    ${userInfo.state.username ? "rechirpStatus" : ""}
                }` 
                : ""}
                posts(pageNum: ${chirpsPageNum}, size:10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}") {
                    posts {
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                            
                        }
                        id
                        text
                        imageURL
                        isEdited
                        
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}

                        isRechirp
                        rootPost {
                            author {
                                username
                                displayName
                                userColor
                            }
                            id
                            text
                            imageURL
                            isEdited
                            
                            postDate(timezone: ${timezone})
                            score
                            ${userInfo.state.username ? "voteStatus" : ""}
                            ${userInfo.state.username ? "rechirpStatus" : ""}
                        }

                    }
                    hasNext
                }
            }
        }`


        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        console.log(response)

        

        setChirpsPageNum(chirpsPageNum + 1)
        setDoneFetching(true);

        const info: UserPayload = response.data.user;
        setChirpsHasNextPage(info.posts.hasNext)
        
        if (chirpsPageNum === 0 && info.pinnedPost !== null) {
            setPinnedPostId(info.pinnedPost.id);
            chirps.unshift(<Chirp
                authorUsername={info.pinnedPost.author.username}
                authorDisplayName={info.pinnedPost.author.displayName}
                authorPictureURL={info.pinnedPost.author.pictureURL}
                userColor={info.pinnedPost.author.userColor}
                id={info.pinnedPost.id}
                postDate={info.pinnedPost.postDate}
                text={info.pinnedPost.text}
                imageURL={info.pinnedPost.imageURL}
                key={info.pinnedPost.id}
                score={info.pinnedPost.score}
                voteStatus={userInfo.state.username ? info.pinnedPost.voteStatus : 0}
                rechirpStatus={userInfo.state.username ? info.pinnedPost.rechirpStatus : false}
                isEdited={info.pinnedPost.isEdited}
                pinned={true}
            />);
        }
        
        setChirps(chirps.concat(info.posts.posts.map((post: PostPayload) => {
            let rechirper: Rechirper | undefined = undefined
            let p = post;
            
            if (post.id === pinnedPostId)
                return null;
            else if (post.isRechirp) {
                if (post.rootPost == null) { //rechirped post deleted
                    return null
                } else {
                    rechirper = {
                        username: post.author.username,
                        displayName: post.author.displayName,
                        userColor: post.author.userColor,
                        dateRechirped: post.postDate
                    }

                    p = post.rootPost;
                }
            }

            return <Chirp
                authorUsername={p.author.username}
                authorDisplayName={p.author.displayName}
                authorPictureURL={p.author.pictureURL}
                id={p.id}
                postDate={p.postDate}
                text={p.text}
                imageURL={p.imageURL}
                key={p.id}
                score={p.score}
                voteStatus={userInfo.state.username ? p.voteStatus : 0}
                rechirpStatus={userInfo.state.username ? p.rechirpStatus : false}
                userColor={p.author.userColor}
                isEdited={p.isEdited}
                pinned={false}

                rechirper={rechirper}
            />
        }).filter((chirp: JSX.Element | null) => chirp !== null) as JSX.Element[]))
        
    }

    //gets followers or following
    const getFollow = async () => {
        let type = "";
        let pageNum = 0

        switch (props.selectedFeed) {
            case SelectedFeed.Followers:
                if (!followersHasNextPage) {
                    return;
                }
                type = "followers";
                pageNum = followersPageNum
                break;
            case SelectedFeed.Following:
                if (!followingHasNextPage) {
                    return;
                }
                type = "following";
                pageNum = followingPageNum
                break;
            default:
                return;
        }
        setDoneFetching(false);
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
            `query {
                user(username: "${props.username}") {
                    ${type}(pageNum: ${pageNum}, size: 10) {
                        users {
                            username
                            displayName
                            pictureURL
                            userColor
                            postCount
                            followerCount
                            followingCount
                        }
                        hasNext
                    }
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        setDoneFetching(true)
        console.log(response)

        const info: {hasNext: boolean, users: UserPayload[]} = response.data.user[type];
        const fetchedUsers = info.users.map((user: UserPayload) => {
            return <UserSearchResult
                username={user.username}
                displayName={user.displayName}
                userColor={user.userColor}
                pictureURL={user.pictureURL}
                postCount={user.postCount}
                followerCount={user.followerCount}
                followingCount={user.followingCount}
                key={type + user.username} />
        })

        if (type === "followers") {
            setFollowersHasNextPage(info.hasNext)
            setFollowersPageNum(followersPageNum + 1)
            setFollowers(followers.concat(fetchedUsers))
        } else if (type === "following") {
            setFollowingHasNextPage(info.hasNext)
            setFollowingPageNum(followingPageNum + 1)
            setFollowing(following.concat(fetchedUsers))
        }

    }


    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, getChirps, () => {
        setChirps([]);
        setChirpsPageNum(0);
        setChirpsHasNextPage(true);
    })

    useScrollBottom(async () => {
        switch (props.selectedFeed) {
            case SelectedFeed.Followers:
            case SelectedFeed.Following:
                await getFollow();
                break;

            case SelectedFeed.Chirps:
            default:
                await getChirps();
                break;
        }
    })


    let feed: JSX.Element[] = []
    let emptyMsg: string = "";
    switch (props.selectedFeed) {
        case SelectedFeed.Chirps:
            feed = chirps;
            emptyMsg = `${props.username} has not made any chirps`;
            break;

        case SelectedFeed.Followers:
            feed = followers;
            emptyMsg = `${props.username} has no followers. Why not be the first one?`;
            break;

        case SelectedFeed.Following:
            feed = following;
            emptyMsg = `${props.username} is not following any users`;
            break;

        default:
            break;
    }


    let placeholder;
    if (props.selectedFeed === SelectedFeed.Chirps) {
        placeholder = (
            <>
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
            </>
        );
    } else {
        placeholder = (
            <>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
            </>
        );
    
    }

    return (
        <div className="mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            {props.selectedFeed === SelectedFeed.Chirps && !props.editingColor ? sortBubble : null}
            <ul className="mt-4">
                {doneFetching && feed.length === 0 ? 
                    <div className="text-center text-white text-lg">
                        {emptyMsg}
                    </div> 
                : null}
                
                {feed}

                {!doneFetching ? 
                    placeholder 
                : null}
            </ul>
        </div>
    )
}

export default ProfileFeed;
