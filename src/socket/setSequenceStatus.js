const rank = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 1,
    'Joker': 'Joker',
}

const isSet = (cards)=>{
    if(cards.length<=2) return 'invalid'
    const suits = new Set()
    const values = new Set()
    cards.forEach(card=>{
        suits.add(card.suit)
        if(card.value!=='Joker'){
            values.add(card.value)
        }
    })
    if(suits.size===cards.length && values.size===1) return 'set'
    else return 'invalid'
}



const isValidSequence = (cards)=>{
    if(cards.length<=2) return 'invalid'
    const suits = new Set()
    const values = []
    let hasJoker = false
    let hasAce = false
    const cardsWithoutJoker = cards.filter(card=>{
        if(card.suit==='A') hasAce =  true
        if(card.suit!=='Joker'){
            suits.add(card.suit)
            values.push(rank[card.value])
            return true
        }
        hasJoker = true
        return false
    })
    if(suits.size!==1) return 'invalid'
    if(cards.length-cardsWithoutJoker.length>1) return 'invalid'
    values.sort((a,b)=>a-b)
    if(isContainNumberSequence(values,hasJoker)==='valid'){
        if(hasJoker) return 'sequence'
        else return 'pure sequence'
    }
    if(hasAce){
        const highValues = values.map(v=>{
            if(v===1) return 14
            return v
        })
        highValues.sort((a,b)=>a-b)
        if(isContainNumberSequence(highValues,hasJoker)==='valid'){
            if(hasJoker) return 'sequence'
            else return 'pure sequence'
        }
    }

    return 'invalid'
}

function isContainNumberSequence(numbers,hasJoker){
    let canUtilizeJoker = hasJoker
    for (let i = 0; i < numbers.length - 1; i++) {
        const diff = numbers[i+1]-numbers[i]
        if (diff===2 && !canUtilizeJoker) {
            return 'invalid';
        }else if(diff===2 && canUtilizeJoker){
            canUtilizeJoker = false
        }else if(diff!==1) return 'invalid'
    }
    return 'valid'
}



function getSetSequenceStatus(handView) {
    const output = []
    handView.forEach(group=>{
        const cards = [...group]
        if(isSet(cards) === 'set'){
            output.push('set')
        }else{
            output.push(isValidSequence(cards))
        }
    })
    return output
}

module.exports = {rank,isSet,isValidSequence,getSetSequenceStatus}