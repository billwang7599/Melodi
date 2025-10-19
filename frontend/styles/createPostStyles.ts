import { StyleSheet } from "react-native";

export const createPostStyles = StyleSheet.create({
  createPostContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  selectedSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  songInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  songTextContainer: {
    flex: 1,
  },
  selectedSongName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedSongArtist: {
    fontSize: 13,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  selectSongButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectSongText: {
    fontSize: 15,
    fontWeight: '500',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 13,
  },
  postButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});