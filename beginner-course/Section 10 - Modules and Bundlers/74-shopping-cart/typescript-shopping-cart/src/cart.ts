import { getItem, Item } from "./items.ts"
import formatCurrency from "./utilities.ts"

// Persist using Session Storage or Local Storage
// NOTE: Maps can't be serialized directly, so I need to convert it to an Array before serializing and saving. When deserializing, I can put the resulting Array directly into the Map constructor and it will give me the correct map.
// TODO: Decide whether to use localStorage or sessionStorage. localStorage persists across browsing sessions, sessionStorage only lasts until the site is closed. I know Kyle used sessionStorage, but I'm on the fence. I feel like most real-world shopping cart applications (like Amazon) probably use something more like localStorage (though, in reality, they probably just have some server storage somewhere that persists your cart across all browsers and apps that you are signed in to).
// 1. Load the cart from storage whenever the cart is rendered.
// 2. Whenever the cart is updated, save it to storage.
// 3. Whenever the cart details are toggled, update the state in storage.
// 4. When something requests to render the cart, check in storage to see whether the details should be visible or not.
type CartItemID = number
type CartItemQuantity = number
let cart: Map<CartItemID, CartItemQuantity> = new Map([
	[1, 2],
	[3, 1]
])

export function addToCart(id: number, quantity: number = 1) {
	let previousQuantity = cart.get(id) ?? 0
	cart.set(id, previousQuantity + quantity)
	renderCart()
}

function removeFromCart(id: number) {
	cart.delete(id)
	renderCart()
}

// Cart Button:
// (DONE) 1. When clicked, toggle whether the cart contents are visible.
// 2. When empty, hide the number bubble, disable the button, and change the SVG color to gray.
const cartElement = document.querySelector("[data-cart]") as HTMLElement
const cartToggleButton = cartElement.querySelector(
	"[data-cart-toggle-button]"
) as HTMLButtonElement
const cartDetails = cartElement.querySelector("[data-cart-details]") as HTMLDivElement
cartToggleButton.addEventListener("click", () => {
	cartDetails.classList.toggle("invisible")
})

// Cart Details
// (DONE) 1. When the cart is rendered, update the number of items on the icon.
// (DONE) 2. If the cart details are shown, rerender the items that are in the cart and update the total price whenever the cart is rendered.
// BONUS: Add a button to clear all contents from the cart.
// BONUS: Add a "compact" view to the cart that makes each cart item into one row. Add a toggle at the top to turn the "compact" view on and off.
const cartItemList = cartDetails.querySelector("[data-cart-item-list]") as HTMLDivElement
const cartTotalPrice = cartDetails.querySelector(
	"[data-cart-total-price]"
) as HTMLSpanElement
const cartTotalItems = cartToggleButton.querySelector(
	"[data-total-cart-items]"
) as HTMLDivElement
function renderCart() {
	cartItemList.innerHTML = ""
	let totalPrice = 0
	let totalItems = 0
	for (let [id, quantity] of cart) {
		const item = getItem(id)
		if (item === null) continue

		totalPrice += quantity * item.priceCents
		totalItems += quantity
		cartItemList.appendChild(renderCartItem(item, quantity))
	}
	cartTotalPrice.textContent = formatCurrency(totalPrice / 100)
	cartTotalItems.textContent = String(totalItems)
}

// Cart Item:
// Structure: { id: number, quantity: number }
// "id" will be used to look up the item in items.ts and the resulting item will be used to populate the HTML.
// When rendered:
// (DONE) 1. Set the image color.
// (DONE) 2. Add an event listener to the "x" button that removes the item from the cart.
// (DONE) 3. Set the item's name.
// (DONE) 4. Set the item's quantity. If the quantity is one, hide the quantity span.
// (DONE) 5. Set the price.
// TODO: Once I'm done implementing everything, the cart contents should be hidden by default.
const cartItemTemplate = cartElement.querySelector(
	"[data-cart-item-template]"
) as HTMLTemplateElement
function renderCartItem(item: Item, quantity: CartItemQuantity) {
	const cartItemElement = cartItemTemplate.content.cloneNode(true) as HTMLDivElement

	const image = cartItemElement.querySelector(
		"[data-cart-item-image]"
	) as HTMLImageElement
	image.src = `https://dummyimage.com/210x130/${item.imageColor}/${item.imageColor}`

	const removeFromCartButton = cartItemElement.querySelector(
		"[data-remove-from-cart-button]"
	) as HTMLButtonElement
	removeFromCartButton.addEventListener("click", () => {
		removeFromCart(item.id)
	})

	const name = cartItemElement.querySelector(
		"[data-cart-item-name]"
	) as HTMLHeadingElement
	name.textContent = item.name

	const quantityElement = cartItemElement.querySelector(
		"[data-cart-item-quantity]"
	) as HTMLSpanElement
	quantityElement.textContent = `x${quantity}`
	if (quantity === 1) quantityElement.classList.add("invisible")

	const price = cartItemElement.querySelector(
		"[data-cart-item-price]"
	) as HTMLDivElement
	price.textContent = formatCurrency((item.priceCents * quantity) / 100)

	return cartItemElement
}

// Render the cart when the page is loaded.
renderCart()
