import { StyleSheet } from "react-native";

export const searchModalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    minHeight: 44,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  modalSpacer: {
    width: 44,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  searchResultArtist: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 1,
  },
  searchResultAlbum: {
    fontSize: 11,
    opacity: 0.6,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});
