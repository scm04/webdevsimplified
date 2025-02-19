import "./utilities/tooltip.ts"
import setupDragAndDrop, { DragEndEvent } from "./dragAndDrop.ts"
import { v4 as uuid } from "uuid"

const STORAGE_PREFIX = "TRELLO_CLONE"
const GROUPS_STORAGE_KEY = `${STORAGE_PREFIX}Groups`

setupDragAndDrop(onDragEnd)

function onDragEnd(event: DragEndEvent) {
	const startGroupId = event.startZone.dataset.groupId as string
	const endGroupId = event.endZone.dataset.groupId as string
	const startGroupItems = groups[startGroupId]
	const endGroupItems = groups[endGroupId]

	const item = startGroupItems.find(t => t.id === event.dragElement.id) as Item
	startGroupItems.splice(startGroupItems.indexOf(item), 1)
	endGroupItems.splice(event.index, 0, item)
	saveGroups()
}

// Challenge: Allow the user to upload and download items
// TODO: Get the upload and download functionality from my original solution and use it as a starting point for this one.
// I don't really feel like going through the whole mental exercise of creating the interface I made last time, so since
// I like that interface, I want to just use it again here, but with the JS converted to TS.
const DOWNLOAD_BUTTON = document.querySelector(
	"[data-download-button]"
) as HTMLButtonElement
const UPLOAD_BUTTON = document.querySelector("[data-upload-button]") as HTMLButtonElement
// (DONE) Challenge: Add the ability to create and delete groups
const GROUPS_ELEMENT = document.querySelector("[data-groups]") as HTMLDivElement
const NEW_GROUP_INPUT = document.querySelector(
	"[data-new-group-input]"
) as HTMLInputElement
NEW_GROUP_INPUT.addEventListener("keyup", e => {
	if (e.key !== "Enter") return
	addGroup()
})
const ADD_GROUP_BUTTON = document.querySelector(
	"[data-add-group-button]"
) as HTMLButtonElement
ADD_GROUP_BUTTON.addEventListener("click", () => addGroup)

function addGroup() {
	const groupName = NEW_GROUP_INPUT.value
	if (groupName === "") return

	groups[groupName] = []

	const groupElement = createGroupElement(groupName)
	GROUPS_ELEMENT.append(groupElement)

	NEW_GROUP_INPUT.value = ""

	saveGroups()
}

type Item = {
	id: string
	text: string
}
type Groups = Record<string, Item[]>
const DEFAULT_GROUPS = {
	Backlog: [
		{ id: uuid(), text: "Create your first item (with a very incredibly long name)" }
	],
	Doing: [],
	Done: []
} as Groups
let groups = loadGroups()

function loadGroups() {
	let groups = localStorage.getItem(GROUPS_STORAGE_KEY) ?? DEFAULT_GROUPS
	if (typeof groups === "string") groups = JSON.parse(groups) as Groups
	return groups
}
function saveGroups() {
	localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
}

// Challenge: Make the groups draggable so they can be reordered by the user
// (DONE) Challenge: Make the group name editable (use TS and CSS to swap a text element with an input)
const DEFAULT_ITEM_FORM_PLACEHOLDER = "Item Name"
const FORM_PLACEHOLDER =
	GROUPS_ELEMENT.dataset.itemFormPlaceholder ?? DEFAULT_ITEM_FORM_PLACEHOLDER
const GROUP_TEMPLATE = document.querySelector(
	"[data-group-template]"
) as HTMLTemplateElement
function createGroupElement(groupName: string) {
	const fragment = GROUP_TEMPLATE.content.cloneNode(true) as DocumentFragment
	const groupElement = fragment.children[0] as HTMLDivElement

	const name = groupElement.querySelector("[data-name]") as HTMLSpanElement
	name.textContent = groupName

	const nameEditor = groupElement.querySelector(
		"[data-group-name-editor]"
	) as HTMLSpanElement
	const nameInput = nameEditor.querySelector("[data-name-input]") as HTMLInputElement

	name.addEventListener("click", () => {
		name.classList.add("hide")
		nameEditor.classList.remove("hide")
		nameInput.placeholder = name.textContent as string
		nameInput.focus()
	})
	function updateGroupName(newName: string) {
		const oldName = name.textContent as string
		let newGroups = {} as Groups
		for (const group in groups) {
			newGroups[group === oldName ? newName : group] = groups[group]
		}
		groups = newGroups
		saveGroups()

		name.textContent = newName
	}
	function hideGroupNameEditor() {
		nameInput.value = ""
		nameEditor.classList.add("hide")
		name.classList.remove("hide")
	}
	nameEditor.addEventListener("keyup", e => {
		if (e.key !== "Escape" && e.key !== "Enter") return
		if (e.key === "Enter" && nameInput.value !== "") {
			updateGroupName(nameInput.value)
		}
		hideGroupNameEditor()
	})

	const saveNameButton = nameEditor.querySelector(
		"[data-save-name-button]"
	) as HTMLButtonElement
	saveNameButton.addEventListener("click", () => {
		if (nameInput.value !== "") updateGroupName(nameInput.value)
		hideGroupNameEditor()
	})

	const deleteButton = groupElement.querySelector(
		"[data-delete-group-button]"
	) as HTMLButtonElement
	deleteButton.addEventListener("click", () => {
		delete groups[groupName]
		saveGroups()
		groupElement.remove()
	})

	const itemList = groupElement.querySelector("[data-items]") as HTMLDivElement
	itemList.dataset.groupId = groupName

	const newItemForm = groupElement.querySelector(
		"[data-new-item-form]"
	) as HTMLFormElement
	const newItemInput = newItemForm.querySelector(
		"[data-new-item-input]"
	) as HTMLInputElement
	newItemInput.placeholder = FORM_PLACEHOLDER
	newItemForm.addEventListener("submit", e => {
		e.preventDefault()

		const itemText = newItemInput.value
		if (itemText === "") return

		const item = { id: uuid(), text: itemText } as Item
		groups[groupName].push(item)

		const itemElement = createItemElement(item)
		const itemList = groupElement.querySelector("[data-group-id]") as HTMLDivElement
		itemList.append(itemElement)
		newItemInput.value = ""

		saveGroups()
	})

	return groupElement
}

function removeItem(itemId: string) {
	const element = document.querySelector(`#${CSS.escape(itemId)}`) as HTMLDivElement
	const groupId = (element.closest("[data-group-id]") as HTMLDivElement).dataset
		.groupId!
	console.log(groupId)
	const groupItems = groups[groupId]
	for (let i = 0; i < groupItems.length; i++) {
		if (groupItems[i].id === element.id) {
			groupItems.splice(i, 1)
			break
		}
	}
	element.remove()
	saveGroups()
}

// Challenge: Make the item text editable (use TS and CSS to swap a text element with an input)
// TODO: Once the group name is done, make those changes to the item text here.
const ITEM_TEMPLATE = document.querySelector(
	"[data-item-template]"
) as HTMLTemplateElement
function createItemElement(item: Item) {
	const fragment = ITEM_TEMPLATE.content.cloneNode(true) as DocumentFragment
	const element = fragment.children[0] as HTMLDivElement
	element.id = item.id

	const text = element.querySelector("[data-item-text]") as HTMLDivElement
	text.innerText = item.text

	const button = element.querySelector("[data-delete-item-button]") as HTMLButtonElement
	button.addEventListener("click", () => removeItem(item.id))

	return element
}

function renderItems() {
	Object.entries(groups).forEach(([groupId, items]) => {
		const groupElement = createGroupElement(groupId)
		GROUPS_ELEMENT.append(groupElement)
		const dropZone = groupElement.querySelector("[data-drop-zone]") as HTMLDivElement
		items.forEach(item => {
			const itemElement = createItemElement(item)
			dropZone.append(itemElement)
		})
	})
}
renderItems()
