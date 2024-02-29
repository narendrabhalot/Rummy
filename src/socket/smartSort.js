const { rank } = require('./setSequenceStatus')

function sortBySuitAndValue(cards) {
    const groupedCards = []
    cards.forEach(card => {
        const suit = card.suit
        const suitIndex = groupedCards.findIndex(group => group[0] && group[0].suit === suit)
        if (suitIndex === -1) {
            groupedCards.push([{ ...card }])
        } else {
            groupedCards[suitIndex].push({ ...card })
        }
    })

    groupedCards.forEach(e => {
        e.sort((a, b) => rank[a.value] - rank[b.value])
    })
    groupedCards.sort((a, b) => b.length - a.length)
    return groupedCards
}
module.exports = {sortBySuitAndValue}